import React, { useState } from 'react';
import { Layout } from 'antd';
import D3BarButton from './components/D3BarButton';
import D3BarComposition from './components/D3BarComposition';
import D3BarOptions from './components/D3BarOptions';
import Datasaurus from './components/Datasaurus';
import NetflixGraph from './components/NetflixGraph';
import NetflixTable from './components/NetflixTable';
import NetflixDistBar from './components/NetflixDistBar';
import SvgDefs from './components/SvgDefs';

const { Row, Col } = Layout;

export default function App() {
  const [isComposition, setIsComposition] = useState(true);
  const [playAnimation, setPlayAnimation] = useState(true);

  return (
    <div id="app">
      <SvgDefs />
      <Row>
        <Col span={6}>
          <Row className="row-half">
            <D3BarButton
              playAnimation={playAnimation}
              onTogglePlay={() => setPlayAnimation(!playAnimation)}
              isComposition={isComposition}
              onToggleMode={() => setIsComposition(!isComposition)}
            />
            {isComposition ? (
              <D3BarComposition playAnimation={playAnimation} />
            ) : (
              <D3BarOptions playAnimation={playAnimation} />
            )}
          </Row>
          <Row className="row-half">
            <Datasaurus />
          </Row>
        </Col>
        <Col span={18}>
          <Row className="row-two-third">
            <NetflixGraph />
          </Row>
          <Row className="row-one-third">
            <Col span={12}>
              <NetflixDistBar />
            </Col>
            <Col span={12}>
              <NetflixTable />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}
