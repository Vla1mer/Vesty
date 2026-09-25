export const LANGUAGES = ["en", "pl"] as const;

export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  pl: "Polski",
};

const en = {
  "language.title": "Language",
  "language.description": "Choose the language of the interface",

  "login.subtitle": "Sign in to your account",
  "login.userName": "Username",
  "login.password": "Password",
  "login.rememberMe": "Remember me",
  "login.submit": "Sign in",
  "login.submitting": "Signing in...",
  "login.noAccount": "Don't have an account?",
  "login.register": "Register",
  "login.wrongPassword": "Invalid username or password",
  "login.lockedOut": "Too many failed attempts. Try again in a few minutes.",
  "login.failed": "Login failed. Please try again.",

  "register.subtitle": "Create your account",
  "register.userName": "Username *",
  "register.password": "Password *",
  "register.passwordHint": "Min 6 characters, at least 1 digit",
  "register.confirmPassword": "Confirm password *",
  "register.firstName": "First name",
  "register.surname": "Surname",
  "register.submit": "Register",
  "register.submitting": "Registering...",
  "register.haveAccount": "Already have an account?",
  "register.signIn": "Sign in",
  "register.failed": "Registration failed. Please try again.",
} as const;

const pl: Record<keyof typeof en, string> = {
  "language.title": "Język",
  "language.description": "Wybierz język interfejsu",

  "login.subtitle": "Zaloguj się na swoje konto",
  "login.userName": "Nazwa użytkownika",
  "login.password": "Hasło",
  "login.rememberMe": "Zapamiętaj mnie",
  "login.submit": "Zaloguj się",
  "login.submitting": "Logowanie...",
  "login.noAccount": "Nie masz konta?",
  "login.register": "Zarejestruj się",
  "login.wrongPassword": "Nieprawidłowa nazwa użytkownika lub hasło",
  "login.lockedOut": "Zbyt wiele nieudanych prób. Spróbuj ponownie za kilka minut.",
  "login.failed": "Logowanie nie powiodło się. Spróbuj ponownie.",

  "register.subtitle": "Załóż swoje konto",
  "register.userName": "Nazwa użytkownika *",
  "register.password": "Hasło *",
  "register.passwordHint": "Minimum 6 znaków, w tym co najmniej 1 cyfra",
  "register.confirmPassword": "Potwierdź hasło *",
  "register.firstName": "Imię",
  "register.surname": "Nazwisko",
  "register.submit": "Zarejestruj się",
  "register.submitting": "Rejestrowanie...",
  "register.haveAccount": "Masz już konto?",
  "register.signIn": "Zaloguj się",
  "register.failed": "Rejestracja nie powiodła się. Spróbuj ponownie.",
};

export const translations = { en, pl };

export type TranslationKey = keyof typeof en;
