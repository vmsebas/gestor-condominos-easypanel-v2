import React from 'react';
import { useConvocatorias } from '@/hooks/useNeonData';

const ConvocatoriasTest: React.FC = () => {
  const { data, isLoading, error, isError, isSuccess } = useConvocatorias();

  console.log('ConvocatoriasTest - Hook data:', { data, isLoading, error, isError, isSuccess });

  if (isLoading) {
    return <div>Loading convocatorias...</div>;
  }

  if (isError) {
    return (
      <div>
        <h1>Error loading convocatorias</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  if (isSuccess && data) {
    return (
      <div>
        <h1>Convocatorias Test Page</h1>
        <p>Found {data.length} convocatorias</p>
        
        <div style={{ marginTop: '20px' }}>
          <h2>Raw Data:</h2>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h2>Convocatorias List:</h2>
          {data.map((conv: any) => (
            <div key={conv.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
              <h3>{conv.building_name} - Assembly {conv.assembly_number}</h3>
              <p>Type: {conv.assembly_type}</p>
              <p>Date: {conv.meeting_date}</p>
              <p>Time: {conv.time}</p>
              <p>Location: {conv.location}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div>No data available</div>;
};

export default ConvocatoriasTest;