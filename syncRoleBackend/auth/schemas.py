from pydantic import BaseModel, EmailStr


class AuthRegisterRequest(BaseModel):
    email: str
    password: str


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class AuthUserResponse(BaseModel):
    id: str
    email: str


class AuthResponse(BaseModel):
    user: AuthUserResponse
    message: str | None = None


class AuthMessageResponse(BaseModel):
    message: str


class GoogleCallbackRequest(BaseModel):
    code: str
