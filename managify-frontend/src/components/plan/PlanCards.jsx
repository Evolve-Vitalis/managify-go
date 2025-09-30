import { useLocation } from "react-router-dom";
import { Card, Button } from "antd";

import webBg from "../../assets/card.jpg"
import { plans } from "../../constants/plans";
export default function PlanCards() {
  const location = useLocation();
  const currentPlan = location.state?.currentPlan || "BASIC";

  return (
    <div
      className="flex justify-center items-center min-h-screen w-full"
      style={{
        backgroundImage: `url(${webBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-6xl">
        {plans.map((plan) => {
          const isSelected = plan.type === currentPlan;
          return (
            <Card
              key={plan.type}
              className={`rounded-3xl shadow-2xl p-10 flex flex-col justify-between transition-transform duration-300
                ${isSelected
                  ? "opacity-60 border-4 border-gray-300 cursor-not-allowed"
                  : "hover:scale-105 border-2 border-gray-200"
                }`}
            >

              <div className="flex flex-col items-center mb-8">
                {plan.icon && <div className={`text-${plan.color}-500 text-4xl mb-4`}>{plan.icon}</div>}
                <h3 className="text-3xl font-medium text-center">{plan.type} Plan</h3>
              </div>

              <p className={`text-5xl font-bold text-${plan.color}-600 text-center mb-8`}>{plan.price}</p>

              <ul className="mb-8 space-y-4 text-gray-700 text-lg">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className={`w-3 h-3 rounded-full bg-${plan.color}-600 inline-block mr-3`}></span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                type={isSelected ? "default" : "primary"}
                block
                size="large"
                disabled={isSelected}
                className={`rounded-full py-4 text-lg ${isSelected ? "bg-gray-300 border-gray-300 cursor-not-allowed" : `bg-${plan.color}-600 hover:bg-${plan.color}-700`
                  }`}
              >
                {isSelected ? "Current Plan" : "Select Plan"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
