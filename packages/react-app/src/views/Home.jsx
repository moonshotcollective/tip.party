import React, { useState } from "react";
import { Input, Button, Form, notification } from "antd";
import { useHistory } from "react-router";
import slugify from "slugify";
import * as storage from "../utils/storage";
import "./Home.css";

export default function Home({ isHost, setHost, ...props }) {
  let history = useHistory();
  const [room, setRoom] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState();

  const handleJoinRoom = ({ room }) => {
    const slugifiedRoom = slugify(room.toLowerCase(), "_");
    if (isHost && isCreatingRoom) {
      storage
        .watchRoom(slugifiedRoom, result => {
          setIsCreatingRoom(false);
          if (result && result.length > 0) {
            notification.error({
              message: "This Room Exists!",
              description: "Join room instead or enter a different room name",
              placement: "topRight",
            });
          } else {
            history.push({ pathname: `/room/${slugifiedRoom}` });
          }
        })
        .catch(() => setIsCreatingRoom(false));
    } else {
      history.push({ pathname: `/room/${slugifiedRoom}` });
    }
  };

  return (
    <div className="Home bg-purple-darkpurple" style={{ margin: "20px auto", width: 500, padding: 60 }}>
      <div>
        <h2 id="joinRoom">Party Time!</h2>
        <div>
          <Form name="join_room" onFinish={handleJoinRoom}>
            <Form.Item name="room" rules={[{ required: true, message: "Please enter a room name!" }]}>
              <div>
                <Input
                  placeholder="Room name"
                  size="large"
                  style={{ backgroundColor: "#0B0228" }}
                  onChange={e => {
                    setRoom(e.target.value);
                  }}
                />
              </div>
            </Form.Item>

            <Form.Item>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  id="button1"
                  type="primary"
                  size="large"
                  shape="round"
                  block
                  htmlType="submit"
                  name="guest"
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
                  name="host"
                  loading={isCreatingRoom}
                  onClick={() => {
                    localStorage.setItem(room + "userType", "host");
                    setHost(true);
                    setIsCreatingRoom(true);
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
