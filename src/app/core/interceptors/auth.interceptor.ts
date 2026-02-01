import {HttpInterceptorFn} from "@angular/common/http";


export const authInterceptor: HttpInterceptorFn = (req, next) => {
//  1. EXCLUSIÓN DE RUTAS PÚBLICAS
    // Si vamos a Login o Register, NO mandamos el token (aunque lo tengamos guardado).
    // Esto evita el error de "Token Expired" al intentar loguearse de nuevo.
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
        return next(req);
    }

    // 2. Obtener el token del almacenamiento
    const token = localStorage.getItem('token');

    // 3. Si existe el token (y no es login), clonamos la petición y le inyectamos el Header
    if (token) {
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(clonedRequest);
    }

    // 4. Si no hay token, dejamos pasar la petición tal cual
    return next(req);
};
