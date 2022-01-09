import React from "react";
import { Input, Button, Form } from "antd";
import { useHistory } from "react-router";
import slugify from "slugify";
import "./Home.css";

export default function Admin() {

  const handleJoinRoom = ({ room }) => {
    window.location.replace(window.location.href + "room/" + room);
  };

  return (
    <div className="Home" style={{ margin: "20px auto", width: 500, padding: 60 }}>
      <div>
        <h2 id="joinRoom">Join a room</h2>
        <div>
          <div>
            <Form name="join_room" onFinish={handleJoinRoom}>
              <Form.Item name="room" rules={[{ required: true, message: "Please enter a room name!" }]}>
                <div>
                  <Input placeholder="Room name" size="large" />
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
    </div>
  );
}
