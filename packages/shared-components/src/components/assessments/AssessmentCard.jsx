// Placeholder - will be extracted from frontend-standalone
// This component displays assessment summary cards

import React from 'react';

const AssessmentCard = ({ assessment, onClick }) => {
  return (
    <div onClick={onClick}>
      <h3>{assessment.name}</h3>
      <p>{assessment.description}</p>
      <span>Status: {assessment.status}</span>
    </div>
  );
};

export default AssessmentCard;
