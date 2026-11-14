from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import check_password_strength

from .models import ActivityLog

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    investment_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name", "role", "is_active",
                  "date_joined", "last_login", "investment_count"]
        read_only_fields = fields

    def get_investment_count(self, obj):
        count = getattr(obj, "investment_count", None)
        return obj.investments.count() if count is None else count


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.INVESTOR)

    class Meta:
        model = User
        fields = ["username", "email", "full_name", "password", "role", "is_active"]
        extra_kwargs = {"full_name": {"required": True, "allow_blank": False}}

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
        candidate = User(username=attrs.get("username", ""), email=attrs.get("email", ""))
        try:
            check_password_strength(attrs["password"], candidate)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"password": exc.detail})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "email", "role", "is_active"]
        extra_kwargs = {"email": {"validators": []}}   # uniqueness is checked (case-insensitively) below

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        acting_user = self.context["request"].user
        if self.instance.pk == acting_user.pk:
            if "role" in attrs and attrs["role"] != User.Role.ADMIN:
                raise serializers.ValidationError("You cannot remove your own administrator role.")
            if attrs.get("is_active") is False:
                raise serializers.ValidationError("You cannot deactivate your own account.")
        return attrs


class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "user", "username", "action", "action_display", "description", "ip_address", "created_at"]
        read_only_fields = fields

    def get_username(self, obj):
        return obj.user.username if obj.user_id else None
