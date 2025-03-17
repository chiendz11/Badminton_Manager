import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: 'Tìm Sân',
      description: 'Tìm kiếm sân cầu ưng ý theo địa điểm, thời gian và loại sân'
    },
    {
      number: 2,
      title: 'Đặt Sân',
      description: 'Chọn thời gian và đặt sân chỉ với vài bước đơn giản'
    },
    {
      number: 3,
      title: 'Thanh Toán',
      description: 'Thanh toán an toàn qua nhiều hình thức khác nhau'
    },
    {
      number: 4,
      title: 'Trải Nghiệm',
      description: 'Đến sân và tận hưởng trận đấu của bạn'
    }
  ];

  return (
    <section className="how-it-works">
      <div className="container">
        <h2 className="section-title">Cách Thức Hoạt Động</h2>
        <div className="steps">
          {steps.map((step) => (
            <div className="step" key={step.number}>
              <div className="step-icon">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;