import React, { useState } from "react";
import { Input, Button, Form } from "antd";
import { useHistory } from "react-router";
import slugify from "slugify";
import "./Home.css";

export default function Home({ setHost, ...props }) {
  let history = useHistory();

  const handleJoinRoom = ({ room }) => {
    const slugifiedRoom = slugify(room.toLowerCase(), "_");
    history.push({ pathname: `/room/${slugifiedRoom}` });
  };

  const [room, setRoom] = useState("");

  return (
    <div className="Home bg-purple-darkpurple" style={{ margin: "20px auto", width: 500, padding: 60 }}>
      <div>
        <h2 id="joinRoom">Party Time!</h2>
        <div>
          <Form name="join_room" onFinish={handleJoinRoom}>
            <Form.Item name="room" rules={[{ required: true, message: "Please enter a room name!" }]}>
              <div>
                <Input placeholder="Room name" size="large" style={{ backgroundColor: "#0B0228" }} onChange={ e =>{
                  setRoom(e.target.value);
                }} />
              </div>
            </Form.Item>

            <Form.Item >
              <div className="grid md:grid-cols-2 gap-4">
              <Button
                id="button1"
                type="primary"
                size="large"
                shape="round"
                block
                htmlType="submit"
                onClick={() => {
                  localStorage.setItem(room + "userType", "guest");
                  setHost(false);

                }}
              >
                Join Room
              </Button>
              <Button
                id="button2"
                type="primary"
                size="large"
                shape="round"
                block
                htmlType="submit"
                onClick={() => {
                  localStorage.setItem(room + "userType", "host");
                  setHost(true);
                }}
              >
                Create Room
              </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
