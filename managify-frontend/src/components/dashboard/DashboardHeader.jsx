import { Tag, Typography, Button } from "antd";
import InviteBell from "./InviteBell";

const { Title, Text } = Typography;

export default function DashboardHeader({ firstName, userProjects, subscriptionData, userID, token }) {

    const getPlanColor = (plan) => ({
        BASIC: "default",
        PREMIUM: "blue",
        PRO: "gold",
    }[plan] || "default");

    const getPlanIcon = (plan) =>
        plan === "PRO" ? "👑" : plan === "PREMIUM" ? "🏆" : null;

    return (
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
                <Title level={2} className="mb-2">Hello, {firstName}!</Title>
                <Text className="text-gray-600 text-lg">
                    You have {userProjects.length} active projects today
                </Text>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
                {/* Plan Tag */}
                <Tag color={getPlanColor(subscriptionData.plan_type)} icon={getPlanIcon(subscriptionData.plan_type)} className="px-3 py-1 text-sm">
                    {subscriptionData.plan_type || 'N/A'} Plan
                </Tag>

                {/* Bell component */}
                <InviteBell userID={userID} token={token} />
            </div>
        </div>
    )
}
