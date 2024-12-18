import React from 'react';

interface Props {
    headers: string[],
    valueKeys: string[],
    data: Array<{ [key: string]: any }>
}

const SimpleTable: React.FC<Props> = ({ data, headers, valueKeys }) => {

    return (
        <table style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
        }}>
            <thead>
                <tr>
                    {headers.length && headers.map((header) => <th key={header} style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "#f4f4f4",
                        zIndex: 1,
                        border: "1px solid #ddd",
                        padding: "5px",
                        textAlign: "left",
                    }}>{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {
                    (data && data.length) && data.map((item: any, index: number) => (
                        <tr key={index}>
                            {valueKeys.length && valueKeys.map((value, index) => (
                                <td key={value} style={{ border: "1px solid #ddd", padding: "10px" }}>
                                    {item[value]}
                                </td>
                            ))}

                        </tr>
                    ))
                }
            </tbody>
        </table>

    );
}

export default SimpleTable;