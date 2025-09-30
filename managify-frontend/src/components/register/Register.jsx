import RegisterForm from "./RegisterForm";
import RegisterHeader from "./RegisterHeader";
import RegisterBackground from "../../assets/register-background.jpg"
export default function Register() {
    return (
        <>
            <div
                className="min-h-screen bg-cover bg-center"
                style={{ backgroundImage: `url(${RegisterBackground})` }}
            >
                <RegisterHeader />
                <RegisterForm />
            </div>

        </>
    )
}