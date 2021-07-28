const ProgressBar = (props) => {
  const { bgcolor, percent, progress, total, title } = props;
  
  const containerStyles = {
    height: 40,
    width: '100%',
    backgroundColor: "#e0e0de",
    borderRadius: 50,
  }

  const fillerStyles = {
    height: '100%',
    width: `${percent || 0}%`,
    backgroundColor: bgcolor,
    borderRadius: 'inherit',
    textAlign: 'center'
  }

  const labelStyles = {
    padding: 5,
    color: 'black',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  }

  return (
    <div style={containerStyles}>
      <div style={fillerStyles}>
        <span style={labelStyles}>{ `${title || ''} ${percent || 0}%  (${(progress/3600)}hr/${(total/3600)}hr)`}</span>
      </div>
    </div>
  );
};

export default ProgressBar;