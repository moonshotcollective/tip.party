import React from "react";
import {  Collapse, Panel } from "antd";
import { CloseOutlined, ExportOutlined } from "@ant-design/icons";
import "./Faq.css";

export default function Rooms() {
  return (
	<div className="w-full my-4">
	<Collapse>
		  <Panel
			header={getTitle("What is the greatest LARP", 1)}
			key={getTitle("What is the greatest LARP", 1)}
			className="faq-panel mx-20"
			onClick={changePanel}
			showArrow={false}
			extra={<ArrowButton />}
		  >
			<p className="w-3/4">{"Youll see on October 2021"}</p>
		  </Panel>
		  <br />
		  <Panel
			header={getTitle("I heard there was a ETHBot vs Moloch comic. Where can I see it?", 2)}
			key={getTitle("I heard there was a ETHBot vs Moloch comic. Where can I see it?", 2)}
			className="faq-panel mx-20"
			onClick={changePanel}
			showArrow={false}
			extra={<ArrowButton />}
		  >
			<p className="w-3/4">
			  <a href="https://gitcoin.co/quadraticlands/mission/ql-lore">Go here</a> 
			</p>
		  </Panel>
		  <br />
		  <Panel
			header={getTitle("What is meditations on moloch?", 3)}
			key={getTitle("What is meditations on moloch?", 3)}
			className="faq-panel mx-20"
			onClick={changePanel}
			showArrow={false}
			extra={<ArrowButton />}
		  >
			<p className="w-3/4">
			  <a href="https://slatestarcodex.com/2014/07/30/meditations-on-moloch/">
				Check this out
			  </a>
			</p>
		  </Panel>
		  <br />
	</Collapse>
  </div>
  );
}
