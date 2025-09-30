import { Layout, Tag, Typography } from "antd";

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function DashboardHeader({ firstName, userProjects, subscriptionData }) {

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
            <div className="mt-4 md:mt-0">
                <Tag color={getPlanColor(subscriptionData.plan_type)} icon={getPlanIcon(subscriptionData.plan_type)} className="px-3 py-1 text-sm">
                    {subscriptionData.plan_type || 'N/A'} Plan
                </Tag>

            </div>
        </div>
    )
}