import { useState } from "react";
import { Button, Popover, Spin, Typography } from "antd";
import { BellOutlined } from "@ant-design/icons";

import { api } from "../api/api";

const { Text } = Typography;

export default function InviteBell({ userID, token }) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invite/project-invite/${userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvites(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div style={{ width: 300, maxHeight: 400, overflowY: "auto" }}>
      {loading ? (
        <div className="flex justify-center p-4"><Spin /></div>
      ) : invites.length === 0 ? (
        <Text className="p-4 block">No invites</Text>
      ) : (
        invites.map((invite) => (
          <div key={invite.id} className="flex justify-between items-center mb-2 p-2 border-b">
            <div>
              <Text strong>{invite.senderName || "Someone"}</Text> invited you to project <Text>{invite.projectName || "Project"}</Text>
            </div>
         
          </div>
        ))
      )}
    </div>
  );
  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      onClick={fetchInvites} 
    >
      <Button icon={<BellOutlined />} />
    </Popover>
  );
}
