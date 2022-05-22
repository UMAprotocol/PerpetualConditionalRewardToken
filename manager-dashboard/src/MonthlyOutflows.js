function MonthlyOutflows(props) {
    return (
        <div>
            <h2><strong>Total Rewards Paid Out</strong></h2>
            <h3>{`$${props.outflows.toFixed(2)}`}?</h3>
            <br></br>
            <h2><strong>KPI Performance</strong></h2>
            <h3>? out of ? KPI periods suceeded</h3>
          
            {/* <h5><strong>Rewards pool balance could hit zero on:</strong></h5>
            <h6>{props.endDate}</h6> */}
          
            </div>
        )
    }

export default MonthlyOutflows;