Death On The Cards

Primeros Pasos

Requisitos Previos
Asegúrate de tener instalado:

Node.js (versión 18 o superior recomendada)

npm o yarn

Instalación
Clona el repositorio

git clone https://github.com/IngSoft1-Sharapeados/frontend-deathofthecards

Navega al directorio del proyecto

Instala las dependencias

npm install

Configuración

Para que la aplicación pueda comunicarse con el backend, necesitas configurar la URL base de la API.

Crea un archivo de entorno local en la raíz del proyecto:

Bash

touch .env.local
Abre el archivo .env.local y añade la siguiente variable, reemplazando la URL con la de tu backend:

# URL del servidor backend
VITE_API_BASE_URL=http://localhost:8000
Uso
Inicia el servidor de desarrollo:

Bash

npm run dev
Abre tu navegador y visita http://localhost:5173 (o la URL que indique la consola).

Estructura Clave
Toda la lógica para la comunicación con el backend está centralizada en:
src/services/apiService.js.

Las variables de entorno se gestionan a través de archivos .env y se acceden en el código mediante import.meta.env.
