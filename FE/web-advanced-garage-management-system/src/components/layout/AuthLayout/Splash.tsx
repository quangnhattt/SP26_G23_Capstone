import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Splash = React.memo(() => {
  return (
    <Container>
      <Content>
        <Spinner />
      </Content>
    </Container>
  );
});

export default Splash;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1a223c;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #69a9f9;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;
