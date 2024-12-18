import React, { useState } from 'react';
import jsCookie from 'js-cookie';

interface Item {
    name: string;
    quantity: number;
}

interface Comment {
    user: string;
    text: string;
}

interface Data {
    items: Item[];
    description: string;
    status: string | null;
    createdAt: string;
    policeStation: string;
    comments: Comment[];
}

const generateRandomData = (): Data[] => {
    return [
        {
            items: [{ name: "Roses", quantity: 5 }],
            description: "These roses are for a romantic surprise for a special occasion.",
            status: null,
            createdAt: new Date().toDateString(),
            policeStation: 'src',
            comments: []
        },
        {
            items: [
                { name: "Laptop", quantity: 8 },
                { name: "Headphones", quantity: 1 }
            ],
            description: "The laptop is needed for work, and the headphones are for online meetings.",
            status: "available",
            createdAt: new Date().toDateString(),
            policeStation: 'src',
            comments: [
                { user: 'acp', text: 'Approved for use in office' }
            ]
        },
        {
            items: [
                { name: "Coffee Maker", quantity: 3 },
                { name: "Tea Set", quantity: 2 }
            ],
            description: "These are essential for setting up a cozy coffee and tea corner at home.",
            status: "available",
            createdAt: new Date().toDateString(),
            policeStation: 'src',
            comments: [
                { user: 'dcp', text: 'Necessary for office pantry' }
            ]
        },
        {
            items: [
                { name: "Books", quantity: 4 },
                { name: "Sketchpad", quantity: 1 },
                { name: "Pencils", quantity: 6 },
                { name: "Blanket", quantity: 1 },
                { name: "Flashlight", quantity: 1 }
            ],
            description: "Books are necessary for expanding knowledge and relaxation during leisure time. The sketchpad, pencils, blanket, and flashlight are for a camping trip.",
            status: "available",
            createdAt: new Date().toDateString(),
            policeStation: 'src',
            comments: []
        }
    ];
};

const AdminHomePage: React.FC = () => {
    const [cards, setCards] = useState<Data[]>(generateRandomData());
    const [selectedCard, setSelectedCard] = useState<Data | null>(null);
    const [showCommentPopup, setShowCommentPopup] = useState<boolean>(false);
    const [newComment, setNewComment] = useState<string>("");
    let userRole = jsCookie.get('role');

    const handleRowClick = (card: Data) => {
        setSelectedCard(card);
        setShowCommentPopup(true);
    };

    const handleCommentSubmit = () => {
        if (selectedCard && newComment) {
            const updatedCards = cards.map(card =>
                card === selectedCard
                    ? { ...card, comments: [...card.comments, { user: 'CP', text: newComment }] }
                    : card
            );
            setCards(updatedCards);
            setNewComment("");
            setShowCommentPopup(false);
        }
    };

    const handleApprove = (index: number) => {
        const updatedCards = [...cards];
        updatedCards[index].status = 'approved';
        setCards(updatedCards);
    };

    const handleForward = (index: number) => {
        const updatedCards = cards.filter((_, i) => i !== index);
        setCards(updatedCards);
    };

    return (
        <div>
            <div>
                <div className='header-title'>
                    <h3>Indents Dashboard</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Police-Station</th>
                            <th>Items</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cards.map((card, index) => (
                            <tr key={index} onClick={() => handleRowClick(card)}>
                                <td>{card.policeStation}</td>
                                <td>
                                    {card.items.map((item, idx) => (
                                        <div key={idx}>{item.name} ({item.quantity})</div>
                                    ))}
                                </td>
                                <td>{card.description}</td>
                                <td>{card.status || 'Pending'}</td>
                                <td>{card.createdAt}</td>
                                <td>
                                    {(userRole === 'admin' || userRole === 'CP' || userRole === 'JCP') && (
                                        <button onClick={(e) => { e.stopPropagation(); handleApprove(index); }}>Approve</button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); handleForward(index); }}>Forward</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showCommentPopup && selectedCard && (
                <div>
                    <div>
                        <h3>Remarks</h3>
                        <ul>
                            {selectedCard.comments.map((comment, index) => (
                                <li key={index}>
                                    <strong>{comment.user}: </strong> {comment.text}
                                </li>
                            ))}
                        </ul>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                        />
                        <div>
                            <button onClick={handleCommentSubmit}>Submit</button>
                            <button onClick={() => setShowCommentPopup(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHomePage;
