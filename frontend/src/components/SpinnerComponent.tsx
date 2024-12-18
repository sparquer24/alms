import { LineWave } from 'react-loader-spinner';

const SpinnerComponent = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '25vh' 
    }}>
      <LineWave
        visible={true}
        height="150"
        width="150"
        ariaLabel="line-wave-loading"
        wrapperStyle={{}}
        wrapperClass=""
        firstLineColor="blue"
        middleLineColor="red"
        lastLineColor="blue"
      />
    </div>
  );
};

export default SpinnerComponent;
