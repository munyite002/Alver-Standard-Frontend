import { Outlet } from "react-router-dom";

function RootLayout() {
    return (
        <html lang="en">
            <body>
                <Outlet />
            </body>
        </html>
    );
}

export default RootLayout;