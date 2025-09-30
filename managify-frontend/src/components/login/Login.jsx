
import RegisterBackground from "../../assets/register-background.jpg"
import LoginHeader from "./LoginHeader";
import LoginForm from "./LoginForm";
export default function Login() {
    return (
        <>
            <div
                className="min-h-screen bg-cover bg-center"
                style={{ backgroundImage: `url(${RegisterBackground})` }}
            >
                <LoginHeader />
                <LoginForm />
            </div>

        </>
    )
}