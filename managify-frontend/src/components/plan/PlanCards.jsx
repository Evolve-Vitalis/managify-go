import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, ConfigProvider, theme } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useTheme } from "../../content/ThemeContent"; // Import useTheme

import webBg from "../../assets/card.jpg";
import { plans } from "../../constants/plans";

export default function PlanCards() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPlan = location.state?.currentPlan || "BASIC";
  
  const { isDarkMode, toggleTheme } = useTheme(); // Use context

  // Dark mode için arka plan resmi opacity'sini ayarla
  const backgroundStyle = {
    backgroundImage: `url(${webBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative",
  };

  // Dark mode için overlay
  const darkOverlay = {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1,
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgBase: isDarkMode ? "#1a1a1a" : "#f9fafb",
          colorTextBase: isDarkMode ? "#f0f0f0" : "#000000",
          colorBorder: isDarkMode ? "#333333" : "#d9d9d9",
          colorBgContainer: isDarkMode ? "#1f1f1f" : "#ffffff",
          colorPrimary: "#1677ff",
        },
      }}
    >
      <div className={isDarkMode ? "dark" : ""}>
        <div
          className={`flex flex-col items-center min-h-screen w-full relative transition-colors ${
            isDarkMode ? "text-gray-200" : "text-gray-800"
          }`}
          style={backgroundStyle}
        >
          {/* Dark mode overlay */}
          {isDarkMode && <div style={darkOverlay} />}
          
          {/* Geri dön butonu */}
          <div className="absolute top-6 left-6 z-10">
            <Button
              type="default"
              shape="circle"
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => navigate("/dashboard")}
              className={isDarkMode ? "border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500" : ""}
            />
          </div>

          {/* Plan Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-6xl mt-20 z-10 relative">
            {plans.map((plan) => {
              const isSelected = plan.type === currentPlan;
              
              // Renk mapping - Tailwind class'larını dynamic kullanmak için
              const colorClasses = {
                blue: {
                  text: "text-blue-500",
                  bg: "bg-blue-600",
                  hover: "hover:bg-blue-700",
                  border: "border-blue-600"
                },
                green: {
                  text: "text-green-500", 
                  bg: "bg-green-600",
                  hover: "hover:bg-green-700",
                  border: "border-green-600"
                },
                gold: {
                  text: "text-yellow-500",
                  bg: "bg-yellow-600", 
                  hover: "hover:bg-yellow-700",
                  border: "border-yellow-600"
                }
              };
              
              const colorConfig = colorClasses[plan.color] || colorClasses.blue;

              return (
                <Card
                  key={plan.type}
                  className={`rounded-3xl shadow-2xl p-10 flex flex-col justify-between transition-all duration-300 ${
                    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  } ${
                    isSelected
                      ? `opacity-60 border-4 ${
                          isDarkMode ? "border-gray-600 cursor-not-allowed" : "border-gray-300 cursor-not-allowed"
                        }`
                      : `border-2 ${
                          isDarkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200"
                        } hover:scale-105`
                  }`}
                >
                  <div className="flex flex-col items-center mb-8">
                    {plan.icon && (
                      <div className={`${colorConfig.text} text-4xl mb-4`}>
                        {plan.icon}
                      </div>
                    )}
                    <h3 className={`text-3xl font-medium text-center ${
                      isDarkMode ? "text-white" : "text-gray-800"
                    }`}>
                      {plan.type} Plan
                    </h3>
                  </div>

                  <p className={`text-5xl font-bold text-center mb-8 ${
                    isDarkMode ? colorConfig.text : `text-${plan.color}-600`
                  }`}>
                    {plan.price}
                  </p>

                  <ul className={`mb-8 space-y-4 text-lg ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isDarkMode ? colorConfig.bg : `bg-${plan.color}-600`
                          } inline-block mr-3`}
                        ></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    type={isSelected ? "default" : "primary"}
                    block
                    size="large"
                    disabled={isSelected}
                    className={`rounded-full py-4 text-lg font-semibold ${
                      isSelected
                        ? `${
                            isDarkMode 
                              ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed" 
                              : "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                          }`
                        : `${
                            isDarkMode 
                              ? `${colorConfig.bg} ${colorConfig.hover} border-${plan.color}-600` 
                              : `bg-${plan.color}-600 hover:bg-${plan.color}-700 border-${plan.color}-600`
                          } text-white`
                    }`}
                  >
                    {isSelected ? "Current Plan" : "Select Plan"}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Açıklama metni */}
          <div className={`mt-8 text-center max-w-2xl px-4 z-10 relative ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}>
            <p className="text-lg">
              {isDarkMode 
                ? "Choose the plan that best fits your project management needs. Upgrade anytime to unlock more features."
                : "Choose the plan that best fits your project management needs. Upgrade anytime to unlock more features."
              }
            </p>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}