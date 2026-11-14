from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import serializers

User = get_user_model()


def check_password_strength(password, user=None):
    try:
        validate_password(password, user=user)
    except DjangoValidationError as exc:
        raise serializers.ValidationError(list(exc.messages))


class UserSerializer(serializers.ModelSerializer):
    """Safe, read-only view of a user (never includes the password)."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "role", "is_active", "date_joined", "last_login"]
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    confirm_password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "username", "password", "confirm_password"]
        read_only_fields = ["id"]
        extra_kwargs = {"full_name": {"required": False, "allow_blank": True}}

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        candidate = User(username=attrs.get("username", ""), email=attrs.get("email", ""),
                         full_name=attrs.get("full_name", ""))
        try:
            check_password_strength(attrs["password"], candidate)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"password": exc.detail})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        # Role is NOT accepted from the client: public sign-ups are always investors.
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Username or email")
    password = serializers.CharField(write_only=True, trim_whitespace=False,
                                     style={"input_type": "password"})

    def validate(self, attrs):
        identifier = attrs["username"].strip()
        password = attrs["password"]
        user = authenticate(request=self.context.get("request"), username=identifier, password=password)
        if user is None:
            candidate = User.objects.filter(
                Q(username__iexact=identifier) | Q(email__iexact=identifier)
            ).first()
            if candidate and not candidate.is_active and candidate.check_password(password):
                raise serializers.ValidationError(
                    "This account has been deactivated. Please contact the administrator."
                )
            raise serializers.ValidationError("Invalid username/email or password.")
        attrs["user"] = user
        return attrs
