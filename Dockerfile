FROM python:3.13-slim

WORKDIR /app

# Copiamos las dependencias desde el subdirectorio e instalamos
COPY syncRoleBackend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el código del repositorio
COPY . .

# Railway usa la variable PORT dinámicamente para exponer el servicio
EXPOSE 8000

CMD ["sh", "-c", "uvicorn syncRoleBackend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
