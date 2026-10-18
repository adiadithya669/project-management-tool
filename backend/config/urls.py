from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def home(request):
    return JsonResponse({"message": "Project Management API is running", "docs": "/api/"})


urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/", include("projects.urls")),
]
