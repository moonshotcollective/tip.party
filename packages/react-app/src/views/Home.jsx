import React, { useEffect, useState } from "react";
import { Input, Button, notification, Form } from "antd";
import { useHistory } from "react-router";
import slugify from "slugify";
import { ethers } from "ethers";
import "./Home.css";

export default function Admin() {
  let history = useHistory();
  
  const handleJoinRoom = ({ room }) => {
    const slugifiedRoom = slugify(room.toLowerCase(), "_");

    history.push(`/room/${slugifiedRoom}`);
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
