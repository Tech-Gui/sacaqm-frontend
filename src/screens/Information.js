import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/SideBar";
import TopNavBar from "../components/topNavBar";
import { Button, Card, Col, Container, Form, Modal } from "react-bootstrap";

import Accordion from 'react-bootstrap/Accordion';
import IconBadge from "../components/iconBadge";


import { FaTemperatureThreeQuarters } from "react-icons/fa6";
import { WiHumidity } from "react-icons/wi";
import { GiDustCloud } from "react-icons/gi";
import { MdOutlineAir } from "react-icons/md";


const Information = () => {
  return (
    <div
      className="d-flex flex-row"
      style={{ minHeight: "100vh", maxHeight: "100vh", background: "#f2f2f2" }}>
      <Sidebar />
      
      <Container fluid className="p-4">
      <TopNavBar />


        <Col md={12}>
          <h1>Welcome to the SACAQM Air Quality Dashboard</h1>
        </Col>

        <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>About Air Quality</Accordion.Header>
              <Accordion.Body>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                  <img
                    src="https://images.unsplash.com/photo-1578604665675-9aee692f6ddc?q=80&w=1531&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Description of the image"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <p>
                    Air quality is crucial for public health as it directly impacts respiratory and cardiovascular well-being. Pollutants such as particulate matter (PM), nitrogen dioxide (NO2), sulfur dioxide (SO2), ozone (O3), and carbon monoxide (CO) are known to exacerbate respiratory conditions like asthma and increase the risk of cardiovascular diseases. Vulnerable populations, including children, the elderly, and individuals with pre-existing health conditions, are particularly susceptible to the adverse effects of poor air quality. Therefore, monitoring air quality levels and implementing effective pollution reduction strategies are essential for safeguarding public health and minimizing the incidence of respiratory and cardiovascular ailments.
                  </p>
                  <br />
                  <p>
                    Furthermore, poor air quality can have broader environmental and economic implications, including reduced crop yields, damage to ecosystems, and increased healthcare costs associated with treating air pollution-related illnesses. Addressing air quality issues requires a multi-faceted approach involving regulatory measures, technological advancements in emission control, public awareness campaigns, and sustainable urban planning. By prioritizing efforts to improve air quality, communities can mitigate health risks, enhance environmental sustainability, and promote overall well-being for present and future generations.
                  </p>
                </div>
              </div>

              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Understanding our metrics</Accordion.Header>
              <Accordion.Body>

              <img src="https://cdn.pixabay.com/photo/2021/11/02/15/07/woman-6763519_1280.jpg" 
              alt="Description of the image" 
              style={{ maxWidth: "100%", height: "auto" }}
              />

              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IconBadge
                  icon={<GiDustCloud />}
                  backgroundColor="rgba(0, 0, 255, 0.3)"
                  color="#0f0"
                  iconSize={15}
                />
                <span style={{ marginLeft: '5px' }}>
                  PM1.0: Ultrafine particles measuring 1.0 micrometer or smaller in diameter, capable of deeply penetrating the respiratory system and potentially entering the bloodstream.
                </span>
              </div>

              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IconBadge
                    icon={<GiDustCloud />}
                    backgroundColor="rgba(0, 0, 255, 0.3)"
                    color="#FF0000"
                    iconSize={15}
                  />
                <span style={{ marginLeft: '5px' }}>
                PM2.5: Fine inhalable particles with a diameter of 2.5 micrometers or smaller, originating from various sources like 
              vehicle exhaust, wildfires, and industrial emissions, posing significant health risks due to their ability to lodge deep into the lungs.

                </span>
              </div>


              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconBadge
                icon={<GiDustCloud />}
                backgroundColor="rgba(0, 0, 255, 0.3)"
                color="#00f"
                iconSize={15}
              />
                <span style={{ marginLeft: '5px' }}>
                PM4: Particulate matter with a diameter of 4 micrometers or smaller, comprising a mix of solid and liquid particles suspended in the air,
              with potential health impacts similar to PM2.5 but larger in size.
                </span>
              </div>
              

              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconBadge
                icon={<GiDustCloud />}
                backgroundColor="rgba(0, 0, 255, 0.3)"
                color="#800080"
                iconSize={15}
              />
                <span style={{ marginLeft: '5px' }}>
                PM10.0: Coarse particles measuring 10 micrometers or smaller, consisting of dust, pollen, mold spores, and other airborne materials, 
              capable of causing respiratory irritation and exacerbating respiratory conditions.
                </span>
              </div>

              

              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconBadge
               icon={<MdOutlineAir />}
               backgroundColor="rgba(255, 216, 0, 0.3)"
               color="#990033"
               iconSize={16}
              />
                <span style={{ marginLeft: '5px' }}>
                NOX (Nitrogen Oxides): A group of highly reactive gases, including nitrogen monoxide (NO) and nitrogen dioxide (NO2), produced mainly from 
              vehicle emissions and industrial processes, contributing to air pollution, respiratory diseases, and the formation of ground-level ozone.
                </span>
              </div>


              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconBadge
               icon={<MdOutlineAir />}
               backgroundColor="rgba(255, 216, 0, 0.3)"
               color="#990033"
               iconSize={16}
              />
                <span style={{ marginLeft: '5px' }}>
                VOC (Volatile Organic Compounds): Organic chemicals with high vapor pressure at room temperature, released from various sources such as vehicle 
              exhaust, paints, cleaning products, and building materials,
               posing health risks including eye, nose, and throat irritation, as well as long-term effects on the central nervous system and other organs.
                </span>
              </div>
              
              <br/>
              <br/>


              <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconBadge
                icon={<WiHumidity />}
                backgroundColor="rgba(0, 255, 0, 0.3)"
                color="#08A045"
                iconSize={19}
              />
                <span style={{ marginLeft: '5px' }}>
                Humidity: The amount of water vapor present in the air, influencing indoor air quality, comfort levels, and the growth of mold and other allergens, 
              with high humidity potentially exacerbating respiratory conditions and promoting microbial growth.
                </span>
              </div>

              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconBadge
                icon={<FaTemperatureThreeQuarters />}
                backgroundColor="rgba(255, 87, 51, 0.5)"
                color="#F00"
                iconSize={15}
              />
                <span style={{ marginLeft: '5px' }}>
                Temperature: A measure of the warmth or coldness of the air, affecting human comfort, respiratory health, and the transmission of infectious 
              diseases, with extreme temperatures posing risks of heatstroke or hypothermia, especially to vulnerable populations.

                </span>
              </div>


              
              <br/>
              <br/>

              </Accordion.Body>
            </Accordion.Item>

        <Accordion.Item eventKey="2">
              <Accordion.Header>Using our site</Accordion.Header>
              <Accordion.Body>
              <div style={{ display: 'flex', flexWrap: 'wrap' , flexDirection: 'row' , alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                 <img src="https://github.com/Tech-Gui/sacaqm-frontend/blob/main/src/map-screen.png?raw=true"
                  alt="Description of the image" 
                  style={{ maxWidth: "100%", minWidth: "300px" , height: "auto" }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  You can use our map to view the sensors that we have currently running. Hovering on them will show you the metadata such as the location and the status of the sensor.
                  Clicking on the sensors on the map will show you the data from those nodes. Clicking the small cards on the map highlighted in red will take you to the analytics page.
                </div>
              </div>

              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                <img src="https://github.com/Tech-Gui/sacaqm-frontend/blob/main/src/buttons-screen.png?raw=true"
                  alt="Description of the image" 
                  style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  The drop down buttons allow the you to choose the name of the sensor you want to view, as well as filter on the dates allowing you to view data that goes as far back as 30 days.
                </div>
              </div>

              <br/>
              <br/>

              <div style={{ display: 'flex' , flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
              
                <div style={{ flex: 1, marginRight: 20 }}>
                <img src="https://github.com/Tech-Gui/sacaqm-frontend/blob/main/src/graph-screen.PNG?raw=true"
                  alt="Description of the image" 
                  style={{ maxWidth: "100%" , minWidth: "300px" , width: "500px" ,  height: "auto" }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  The charts show the graphs for the respective metrics, the x-axis shows the date and the y-axis shows the value of the metric. Clicking on them will allow you to view the metric in futher analysis.
                </div>
              </div>

              <br/>
              <br/>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                <img src="https://github.com/Tech-Gui/sacaqm-frontend/blob/main/src/analytics-screen.png?raw=true"
                  alt="Description of the image" 
                  style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  The "Analytics" page allows you to view a metric in further detail. The dropdown buttons allow you to select the sensor and time period. The dropdown on the chart  will allow you to choose the metric you want to analyze.
                </div>
              </div>



              </Accordion.Body>
            </Accordion.Item>

        </Accordion>



      </Container>
    </div>
  );
};

export default Information;
