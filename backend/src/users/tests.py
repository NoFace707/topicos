from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


User = get_user_model()


class AuthenticationApiTests(APITestCase):
    def test_registration_accepts_simple_six_character_password(self):
        response = self.client.post(
            reverse("register"), {"username": "ana", "password": "123456"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="ana")
        self.assertTrue(user.check_password("123456"))
        self.assertNotEqual(user.password, "123456")

    def test_registration_rejects_short_and_duplicate_username(self):
        short = self.client.post(
            reverse("register"), {"username": "ana", "password": "12345"}, format="json"
        )
        self.assertEqual(short.status_code, status.HTTP_400_BAD_REQUEST)
        User.objects.create_user(username="ana", password="123456")
        duplicate = self.client.post(
            reverse("register"), {"username": "ANA", "password": "abcdef"}, format="json"
        )
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_session_and_logout(self):
        User.objects.create_user(username="ana", password="123456")
        invalid = self.client.post(
            reverse("login"), {"username": "ana", "password": "badpass"}, format="json"
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid.data["detail"], "Credenciales inválidas.")

        login = self.client.post(
            reverse("login"), {"username": "ana", "password": "123456"}, format="json"
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        session = self.client.get(reverse("session"))
        self.assertEqual(session.status_code, status.HTTP_200_OK)
        self.assertEqual(session.data["user"]["username"], "ana")

        logout = self.client.post(reverse("logout"))
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(reverse("session")).status_code, status.HTTP_403_FORBIDDEN)

    def test_financial_resources_require_authentication(self):
        response = self.client.get(reverse("account-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

