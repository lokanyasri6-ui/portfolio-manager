from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from admin_panel.models import ActivityLog
from admin_panel.utils import log_activity

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_activity(request, user, ActivityLog.Action.REGISTER, f"New account '{user.username}'")
        return Response(
            {"message": "Registration successful. You can now log in.", "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            if "non_field_errors" in serializer.errors:
                attempted = str(request.data.get("username", ""))[:100]
                log_activity(request, None, ActivityLog.Action.LOGIN_FAILED,
                             f"Failed login attempt for '{attempted}'")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        login(request, user)
        log_activity(request, user, ActivityLog.Action.LOGIN, f"'{user.username}' logged in")
        refresh = RefreshToken.for_user(user)
        return Response({
    "message": "Login successful.",
    "user": UserSerializer(user).data,
    "access": str(refresh.access_token),
    "refresh": str(refresh),
    "token": str(refresh.access_token),
    "redirect": "admin-dashboard" if user.is_admin_role else "dashboard",
})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        log_activity(request, request.user, ActivityLog.Action.LOGOUT, f"'{request.user.username}' logged out")
        logout(request)
        return Response({"message": "Logged out."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFView(APIView):
    """The frontend calls this once so the browser receives the CSRF cookie."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"detail": "CSRF cookie set."})
