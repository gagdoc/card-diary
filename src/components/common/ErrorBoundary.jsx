import React from 'react';

/**
 * Global Error Boundary.
 * Catches any unhandled JS errors in the React tree and shows a
 * friendly recovery screen instead of a blank white page.
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div
                style={{
                    minHeight: '100dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8f9fa',
                    padding: '2rem',
                    fontFamily: '-apple-system, sans-serif',
                    textAlign: 'center',
                    gap: '1rem',
                }}
            >
                <div style={{ fontSize: 48 }}>😔</div>
                <h2 style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>
                    앱을 불러오는 중 문제가 발생했습니다
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0, maxWidth: 300 }}>
                    이미지가 너무 크거나 저장 공간이 부족할 수 있습니다.
                    새로고침 후 다시 시도해 주세요.
                </p>
                {this.state.error?.message && (
                    <code
                        style={{
                            background: '#f3f4f6',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 11,
                            color: '#9ca3af',
                            maxWidth: 320,
                            overflowWrap: 'break-word',
                        }}
                    >
                        {this.state.error.message}
                    </code>
                )}
                <button
                    onClick={this.handleReload}
                    style={{
                        marginTop: 8,
                        padding: '14px 32px',
                        background: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 16,
                        fontWeight: 900,
                        fontSize: 14,
                        cursor: 'pointer',
                        letterSpacing: 1,
                    }}
                >
                    새로고침
                </button>
            </div>
        );
    }
}
