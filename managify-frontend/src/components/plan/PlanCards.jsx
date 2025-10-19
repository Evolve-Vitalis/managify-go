import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, ConfigProvider, theme } from "antd";
import { ArrowLeftOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useTheme } from "../../content/ThemeContent";

import { plans } from "../../constants/plans";

export default function PlanCards() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPlan = location.state?.currentPlan || "BASIC";
  
  const { isDarkMode, toggleTheme } = useTheme();



  const darkOverlay = {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
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
          className={`flex flex-col items-center min-h-screen w-full relative py-12 px-4 transition-colors ${
            isDarkMode ? "text-gray-200" : "text-gray-800"
          }`}

        >
          {isDarkMode && <div style={darkOverlay} />}
          
          <div className="absolute top-8 left-8 z-10">
            <Button
              type="default"
              shape="circle"
              icon={<ArrowLeftOutlined />}
              size="large"
              onClick={() => navigate("/dashboard")}
              className={isDarkMode ? "border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500" : ""}
            />
          </div>

          <div className="max-w-7xl w-full z-10 relative">
            <div className="text-center mb-12">
              <h1 className={`text-5xl font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Choose Your Plan
              </h1>
              <p className={`text-xl ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}>
                Select the perfect plan for your project management needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isSelected = plan.type === currentPlan;
                
                const colorClasses = {
                  blue: {
                    text: isDarkMode ? "text-blue-400" : "text-blue-600",
                    bg: isDarkMode ? "bg-blue-500" : "bg-blue-600",
                    hover: isDarkMode ? "hover:bg-blue-600" : "hover:bg-blue-700",
                    lightBg: isDarkMode ? "bg-blue-500 bg-opacity-10" : "bg-blue-50",
                    border: isDarkMode ? "border-blue-500" : "border-blue-200"
                  },
                  green: {
                    text: isDarkMode ? "text-green-400" : "text-green-600",
                    bg: isDarkMode ? "bg-green-500" : "bg-green-600",
                    hover: isDarkMode ? "hover:bg-green-600" : "hover:bg-green-700",
                    lightBg: isDarkMode ? "bg-green-500 bg-opacity-10" : "bg-green-50",
                    border: isDarkMode ? "border-green-500" : "border-green-200"
                  },
                  gold: {
                    text: isDarkMode ? "text-yellow-400" : "text-yellow-600",
                    bg: isDarkMode ? "bg-yellow-500" : "bg-yellow-600",
                    hover: isDarkMode ? "hover:bg-yellow-600" : "hover:bg-yellow-700",
                    lightBg: isDarkMode ? "bg-yellow-500 bg-opacity-10" : "bg-yellow-50",
                    border: isDarkMode ? "border-yellow-500" : "border-yellow-200"
                  }
                };
                
                const colorConfig = colorClasses[plan.color] || colorClasses.blue;

                return (
                  <div
                    key={plan.type}
                    className={`relative ${
                      isSelected ? "transform scale-105" : ""
                    }`}
                  >
                    {isSelected && (
                      <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${
                        isDarkMode ? "bg-gray-700" : "bg-white"
                      } px-6 py-2 rounded-full shadow-lg z-10 border-2 ${colorConfig.border}`}>
                        <span className={`font-semibold ${colorConfig.text}`}>
                          Current Plan
                        </span>
                      </div>
                    )}
                    
                    <Card
                      className={`rounded-2xl shadow-xl h-full flex flex-col transition-all duration-300 border-2 ${
                        isDarkMode ? "bg-gray-800" : "bg-white"
                      } ${
                        isSelected
                          ? `${colorConfig.border}`
                          : isDarkMode 
                            ? "border-gray-700 hover:border-gray-600" 
                            : "border-gray-200 hover:border-gray-300"
                      } ${!isSelected && "hover:shadow-2xl hover:-translate-y-1"}`}
                    >
                      <div className={`${colorConfig.lightBg} rounded-xl p-8 mb-6`}>
                        <div className="flex flex-col items-center">
                          {plan.icon && (
                            <div className={`${colorConfig.text} text-5xl mb-4`}>
                              {plan.icon}
                            </div>
                          )}
                          <h3 className={`text-2xl font-bold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}>
                            {plan.type}
                          </h3>
                        </div>
                      </div>

                      <div className="text-center mb-8">
                        <div className={`text-5xl font-bold ${colorConfig.text}`}>
                          {plan.price}
                        </div>
                        <div className={`text-sm mt-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          per month
                        </div>
                      </div>

                      <div className="flex-grow mb-6">
                        <ul className="space-y-4">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircleFilled 
                                className={`${colorConfig.text} text-lg mr-3 mt-1 flex-shrink-0`}
                              />
                              <span className={`${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}>
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        type="primary"
                        block
                        size="large"
                        disabled={isSelected}
                        className={`rounded-xl h-12 font-semibold text-base ${
                          isSelected
                            ? isDarkMode 
                              ? "bg-gray-700 border-gray-600 text-gray-400" 
                              : "bg-gray-200 border-gray-200 text-gray-500"
                            : `${colorConfig.bg} ${colorConfig.hover} border-0`
                        }`}
                      >
                        {isSelected ? "Your Current Plan" : "Select Plan"}
                      </Button>
                    </Card>
                  </div>
                );
              })}
            </div>

            <div className={`mt-12 text-center max-w-3xl mx-auto ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}>
              <p className="text-lg">
                All plans include a 14-day free trial. Upgrade, downgrade, or cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}