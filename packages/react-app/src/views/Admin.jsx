import React, { useState } from "react";
import { AddressInput } from "../components";
import { Button, notification } from "antd";

export default function Admin({
  writeContracts,
  readContracts,
  admin,
  address,
  yourLocalBalance,
  mainnetProvider,
  tx,
  appServer,
}) {
  const [newAdmin, setNewAdmin] = useState("");

  return (
    <div style={{ margin: "20px auto", width: 500, padding: 60, border: "3px solid" }}>
      <div style={{ marginTop: 10 }}>
        <h2>Add Admin</h2>
        <div>
          <div style={{ padding: 10 }}>
            <AddressInput
              autoFocus
              ensProvider={mainnetProvider}
              placeholder="Address"
              address={newAdmin}
              onChange={setNewAdmin}
            />
          </div>
        </div>
        <div style={{ marginBottom: "10px" }}>
          {admin && (
            <div>
              <Button
                style={{ marginLeft: "10px" }}
                onClick={async () => {
                  const result = tx(writeContracts.TokenDistributor.addNewDistributor(newAdmin), update => {
                    console.log("📡 Admin Update:", update);
                    if (update && (update.status === "confirmed" || update.status === 1)) {
                      console.log(" 🍾 Transaction " + update.hash + " finished!");
                      notification.success({
                        message: "Admin add",
                        description: "successful",
                        placement: "bottomRight",
                      });
                    }
                  });
                  setNewAdmin("");
                }}
              >
                Add User As Admin
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
