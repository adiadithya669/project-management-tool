from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Comment, Project, Task


def _is_member(project, user):
    return project.members.filter(pk=user.pk).exists()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ProjectSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.username", read_only=True)
    members_detail = UserSerializer(source="members", many=True, read_only=True)
    task_count = serializers.SerializerMethodField()
    done_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ("id", "name", "description", "owner", "owner_name", "members_detail",
                  "task_count", "done_count", "created_at")
        read_only_fields = ("owner",)

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_done_count(self, obj):
        return obj.tasks.filter(status=Task.Status.DONE).count()


class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source="assignee.username", read_only=True, default=None)

    class Meta:
        model = Task
        fields = ("id", "project", "title", "description", "status", "priority",
                  "assignee", "assignee_name", "due_date", "created_at")

    def validate(self, attrs):
        project = attrs.get("project") or self.instance.project
        user = self.context["request"].user
        if not _is_member(project, user):
            raise serializers.ValidationError("You are not a member of this project.")
        assignee = attrs.get("assignee")
        if assignee and not _is_member(project, assignee):
            raise serializers.ValidationError({"assignee": "Assignee must be a project member."})
        return attrs


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "task", "author", "author_name", "text", "created_at")
        read_only_fields = ("author",)

    def validate_task(self, task):
        if not _is_member(task.project, self.context["request"].user):
            raise serializers.ValidationError("You are not a member of this project.")
        return task
