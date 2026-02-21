import React from "react";
import styled from "styled-components";
import AppLoading from "@/assets/icons/Apploading2.gif";

const Splash = React.memo(() => {
  return (
    <Container>
      <Content>
        <img
          src={AppLoading}
          alt="Loading..."
          style={{
            width: "100px",
            height: "100px",
            justifySelf: "center",
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }}
        />
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
