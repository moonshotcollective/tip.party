import React, { useEffect, useState } from "react";
import { Input, Button, notification, Form } from "antd";
import { useHistory } from "react-router";
import slugify from "slugify";
import { ethers } from "ethers";

export default function Admin({ writeContracts, readContracts, admin, mainnetProvider, tx }) {
  let history = useHistory();
  const [tipstaCost, setTipstaCost] = useState("...");

  const handleJoinRoom = ({ room }) => {
    const slugifiedRoom = slugify(room.toLowerCase(), "_");

    history.push(`/room/${slugifiedRoom}`);
  };

  const becomeDistributor = async () => {
    const value = ethers.utils.parseEther(tipstaCost);
    const result = tx(writeContracts.Tipsta.becomeATipsta({ value }), update => {
      console.log("📡 Admin Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
        notification.success({
          message: "You just became a tipsta! Thanks for supporting the platform",
          description: "successful",
          placement: "bottomRight",
        });
      }
    });
  };

  const initialize = async () => {
    if (readContracts?.Tipsta) {
      const cost = (await readContracts.Tipsta.tipperCost()) || 0;
      setTipstaCost(ethers.utils.formatEther(ethers.BigNumber.from(cost)).toString());
    }
  };

  useEffect(() => {
    initialize();
  }, [readContracts]);

  return (
    <div style={{ margin: "20px auto", width: 500, padding: 60, border: "3px solid" }}>
      <div style={{ marginTop: 10 }}>
        <h2>Join a room</h2>
        <div>
          <div style={{ padding: 10 }}>
            <Form name="join_room" onFinish={handleJoinRoom}>
              <Form.Item name="room" rules={[{ required: true, message: "Please enter a room name!" }]}>
                <Input placeholder="Room name" size="large" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" size="large" block htmlType="submit">
                  Load Room
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>

        <div>
          {!admin && (
            <>
              <div style={{ marginTop: 10, marginBottom: 10 }}>OR</div>
              <div>
                <Button block onClick={becomeDistributor} loading={tipstaCost === "..."}>
                  Become A Distributor for {tipstaCost} ETH
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
