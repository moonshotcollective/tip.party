import React from "react";
import { Input, Button, Form } from "antd";
import slugify from "slugify";
import "./Home.css";

export default function Admin() {
  const handleJoinRoom = ({ room }) => {
    const slugifiedRoom = slugify(room.toLowerCase(), "_");
    window.location.replace(window.location.href + "room/" + slugifiedRoom);
  };

  return (
    <div className="Home bg-purple-darkpurple" style={{ margin: "20px auto", width: 500, padding: 60 }}>
      <div>
        <h2 id="joinRoom">Join a room</h2>
        <div>
          <Form name="join_room" onFinish={handleJoinRoom}>
            <Form.Item name="room" rules={[{ required: true, message: "Please enter a room name!" }]}>
              <div>
                <Input placeholder="Room name" size="large" style={{ backgroundColor: "#0B0228" }} />
              </div>
            </Form.Item>

            <Form.Item>
              <Button id="button1" type="primary" size="large" block htmlType="submit">
                Load Room
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
