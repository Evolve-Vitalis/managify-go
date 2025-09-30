import { CrownOutlined, TrophyOutlined } from "@ant-design/icons";
export const plans = [
    { type: "BASIC", price: "$0", features: ["3 Projects", "Basic Support"], icon: null, color: "gray" },
    { type: "PREMIUM", price: "$49", features: ["10 Projects", "Priority Support"], icon: <TrophyOutlined />, color: "blue" },
    { type: "PRO", price: "$99", features: ["Unlimited Projects", "24/7 Support"], icon: <CrownOutlined />, color: "gold" },
];