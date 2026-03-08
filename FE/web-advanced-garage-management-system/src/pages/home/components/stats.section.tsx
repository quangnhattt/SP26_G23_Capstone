import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const useCountAnimation = (end: number, duration: number = 2000, decimals: number = 0) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const startValue = 0;

          const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentCount = startValue + (end - startValue) * easeOutQuart;

            setCount(decimals > 0 ? parseFloat(currentCount.toFixed(decimals)) : Math.floor(currentCount));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };

          animate();
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [end, duration, hasAnimated, decimals]);

  return { count, elementRef };
};

const AnimatedStatNumber = ({ 
  value, 
  suffix = "", 
  decimals = 0 
}: { 
  value: number; 
  suffix?: string; 
  decimals?: number;
}) => {
  const { count, elementRef } = useCountAnimation(value, 2000, decimals);

  return (
    <StatNumber ref={elementRef}>
      {decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}
      {suffix}
    </StatNumber>
  );
};

const StatsSection = () => {
  return (
    <StatsSectionContainer>
      <StatsContainer>
        <StatsGrid>
          <StatItem>
            <AnimatedStatNumber value={10000} suffix="+" />
            <StatLabel>Khách hàng tin tưởng</StatLabel>
          </StatItem>
          <StatItem>
            <AnimatedStatNumber value={50000} suffix="+" />
            <StatLabel>Lượt sử dụng dịch vụ</StatLabel>
          </StatItem>
          <StatItem>
            <AnimatedStatNumber value={15} suffix="+" />
            <StatLabel>Năm kinh nghiệm</StatLabel>
          </StatItem>
          <StatItem>
            <AnimatedStatNumber value={4.9} suffix="/5" decimals={1} />
            <StatLabel>Đánh giá từ khách hàng</StatLabel>
          </StatItem>
        </StatsGrid>
      </StatsContainer>
    </StatsSectionContainer>
  );
};

export default StatsSection;

const StatsSectionContainer = styled.section`
  padding: 4rem 1rem;
  background-color: #ffffff;
  overflow-x: hidden;
  width: 100%;
`;

const StatsContainer = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  text-align: center;
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const StatItem = styled.div``;

const StatNumber = styled.h3`
  font-size: 1.875rem;
  font-weight: bold;
  color: #2563eb;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.p`
  color: #6b7280;
`;
