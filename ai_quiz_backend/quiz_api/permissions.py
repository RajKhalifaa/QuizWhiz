from rest_framework import permissions

class IsTeacher(permissions.BasePermission):
    """
    Custom permission to allow only teachers (staff) to perform certain actions.
    """
    def has_permission(self, request, view):
        # Check if user is authenticated and is staff
        return request.user and request.user.is_authenticated and request.user.is_staff