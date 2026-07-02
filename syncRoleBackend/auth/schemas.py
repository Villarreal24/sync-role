from pydantic import BaseModel, EmailStr


class AuthRegisterRequest(BaseModel):
    email: str
    password: str


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class AuthRefreshRequest(BaseModel):
    refresh_token: str


class AuthUserResponse(BaseModel):
    id: str
    email: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: AuthUserResponse


class AuthMessageResponse(BaseModel):
    message: str


class GoogleCallbackRequest(BaseModel):
    code: str
