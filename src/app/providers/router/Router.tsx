import ProtectedRoute from "./ProtectedRoute";
import type { RouterProps, RouteType } from "./router.types"
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';

const Router: React.FC<RouterProps> = ({
    routes
}) => {
    return (
        <BrowserRouter>
            <Routes>
                {
                    routes.map((route: RouteType, index: number) => (
                        <Route
                            key={index}
                            path={route.path}
                            element={
                                route.haveLayout ? (
                                    <ProtectedRoute haveLayout={true}>
                                        <route.component />
                                    </ProtectedRoute>
                                ) : (
                                    <route.component />
                                )
                            }
                        />
                    ))
                }
                <Route path="*" element={<Navigate to={"/"} replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default Router
