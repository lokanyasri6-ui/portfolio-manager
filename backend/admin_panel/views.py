from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole
from investments.models import Investment
from reports.models import Report

from .models import ActivityLog
from .serializers import (ActivityLogSerializer, AdminUserCreateSerializer, AdminUserSerializer,
                          AdminUserUpdateSerializer)
from .utils import log_activity

User = get_user_model()


class StatsView(APIView):
    """Basic system statistics (counts only: admins never see anyone's investment details)."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        now = timezone.now()
        by_category = {c: 0 for c in Investment.Category.values}
        for row in Investment.objects.values("category").annotate(total=Count("id")):
            by_category[row["category"]] = row["total"]
        return Response({
            "total_users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "inactive_users": User.objects.filter(is_active=False).count(),
            "investor_count": User.objects.filter(role=User.Role.INVESTOR).count(),
            "admin_count": User.objects.filter(role=User.Role.ADMIN).count(),
            "new_users_last_7_days": User.objects.filter(date_joined__gte=now - timedelta(days=7)).count(),
            "total_investments": Investment.objects.count(),
            "investments_by_category": by_category,
            "total_reports": Report.objects.count(),
            "activities_last_24h": ActivityLog.objects.filter(created_at__gte=now - timedelta(hours=24)).count(),
        })


class AdminUserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Manage user accounts (administrator only).

    GET   /api/admin/users/?q=&role=&is_active=   list / search / filter
    POST  /api/admin/users/                       add a user
    GET   /api/admin/users/<id>/                  details
    PATCH /api/admin/users/<id>/                  edit full_name, email, role, is_active
    POST  /api/admin/users/<id>/activate/         activate account
    POST  /api/admin/users/<id>/deactivate/       deactivate account (cannot log in; data is kept)

    Accounts are deactivated rather than deleted so investment records are never lost by accident.
    """

    permission_classes = [IsAdminRole]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        queryset = User.objects.annotate(investment_count=Count("investments")).order_by("-date_joined", "-id")
        params = self.request.query_params
        q = (params.get("q") or "").strip()
        if q:
            queryset = queryset.filter(
                Q(username__icontains=q) | Q(email__icontains=q) | Q(full_name__icontains=q))
        role = params.get("role")
        if role in User.Role.values:
            queryset = queryset.filter(role=role)
        is_active = params.get("is_active")
        if is_active in ("true", "false"):
            queryset = queryset.filter(is_active=(is_active == "true"))
        return queryset

    def _fresh(self, pk):
        return self.get_queryset().get(pk=pk)

    def create(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_activity(request, request.user, ActivityLog.Action.USER_CREATED,
                     f"Admin created account '{user.username}' ({user.role})")
        return Response(AdminUserSerializer(self._fresh(user.pk)).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        instance = self.get_object()
        was_active = instance.is_active
        serializer = AdminUserUpdateSerializer(instance, data=request.data, partial=True,
                                               context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_activity(request, request.user, ActivityLog.Action.USER_UPDATED, f"Admin updated '{user.username}'")
        if was_active != user.is_active:
            act = ActivityLog.Action.USER_ACTIVATED if user.is_active else ActivityLog.Action.USER_DEACTIVATED
            log_activity(request, request.user, act, f"'{user.username}'")
        return Response(AdminUserSerializer(self._fresh(user.pk)).data)

    def _set_active(self, request, pk, value):
        user = self.get_object()
        if user.pk == request.user.pk and not value:
            return Response({"detail": "You cannot deactivate your own account."},
                            status=status.HTTP_400_BAD_REQUEST)
        if user.is_active != value:
            user.is_active = value
            user.save(update_fields=["is_active"])
            act = ActivityLog.Action.USER_ACTIVATED if value else ActivityLog.Action.USER_DEACTIVATED
            log_activity(request, request.user, act, f"'{user.username}'")
        return Response(AdminUserSerializer(self._fresh(user.pk)).data)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        return self._set_active(request, pk, True)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        return self._set_active(request, pk, False)


class ActivityPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 200


class ActivityLogListView(generics.ListAPIView):
    """GET /api/admin/activity/?action=login&user=<id>&limit=50&offset=0"""

    permission_classes = [IsAdminRole]
    serializer_class = ActivityLogSerializer
    pagination_class = ActivityPagination

    def get_queryset(self):
        queryset = ActivityLog.objects.select_related("user")
        params = self.request.query_params
        action_name = params.get("action")
        if action_name in ActivityLog.Action.values:
            queryset = queryset.filter(action=action_name)
        user_id = params.get("user")
        if user_id and user_id.isdigit():
            queryset = queryset.filter(user_id=int(user_id))
        return queryset
