 import {
  ProjectOutlined,
  IssuesCloseOutlined,
  TeamOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  BellOutlined,
  RightOutlined
} from '@ant-design/icons';
 
 export const features = [
    {
      icon: <ProjectOutlined className="text-3xl text-blue-600" />,
      title: "Project Management",
      description: "Easily create your projects, categorize them, and track progress."
    },
    {
      icon: <IssuesCloseOutlined className="text-3xl text-green-600" />,
      title: "Task Tracking",
      description: "Prioritize tasks, track their status, and share with your team."
    },
    {
      icon: <TeamOutlined className="text-3xl text-purple-600" />,
      title: "Team Collaboration",
      description: "Invite team members to projects and assign roles."
    },
    {
      icon: <BarChartOutlined className="text-3xl text-orange-600" />,
      title: "Reporting",
      description: "Monitor project progress and get detailed reports."
    },
    {
      icon: <ClockCircleOutlined className="text-3xl text-red-600" />,
      title: "Time Tracking",
      description: "Set deadlines for tasks and get reminders."
    },
    {
      icon: <BellOutlined className="text-3xl text-cyan-600" />,
      title: "Notifications",
      description: "Receive instant notifications for important updates."
    }
  ];