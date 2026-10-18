from django.contrib.auth.models import User
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Comment, Project, Task
from .serializers import (CommentSerializer, ProjectSerializer, RegisterSerializer,
                          TaskSerializer, UserSerializer)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in permissions.SAFE_METHODS or obj.owner_id == request.user.id


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Project.objects.filter(members=self.request.user).distinct()

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        project.members.add(self.request.user)

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        project = self.get_object()
        try:
            user = User.objects.get(username=request.data.get("username", ""))
        except User.DoesNotExist:
            return Response({"detail": "No user with that username."}, status=status.HTTP_404_NOT_FOUND)
        project.members.add(user)
        return Response(ProjectSerializer(project, context={"request": request}).data)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = Task.objects.filter(project__members=self.request.user).select_related("assignee").distinct()
        project_id = self.request.query_params.get("project")
        return qs.filter(project_id=project_id) if project_id else qs


class CommentViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = CommentSerializer

    def get_queryset(self):
        qs = Comment.objects.filter(task__project__members=self.request.user).select_related("author").distinct()
        task_id = self.request.query_params.get("task")
        return qs.filter(task_id=task_id) if task_id else qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
