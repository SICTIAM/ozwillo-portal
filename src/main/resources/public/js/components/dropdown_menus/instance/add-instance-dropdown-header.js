import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

class AddInstanceDropdownHeader extends React.Component {

    static propTypes = {
        apps: PropTypes.array.isRequired,
        app: PropTypes.object,
        onAddInstance: PropTypes.func.isRequired,
        onChangeInstance: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            error: '',
            isLoading: false
        };

        //bind methods
        this.onOptionChange = this.onOptionChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    onOptionChange(selectedOption) {
        this.props.onChangeInstance(selectedOption)
    }

    onSubmit(e) {
        e.preventDefault();

        this.setState({ isLoading: true });

        this.props.onAddInstance()
            .then(() => this.setState({ error: '', isLoading: false }))
            .catch(err => {
                console.error(err);
                this.setState({ error: 'An error has been occurred...', isLoading: false });
            });
    }

    render() {
        return <header className="dropdown-header">
            <form className="form flex-row" onSubmit={this.onSubmit}>
                <Select
                    className="select"
                    name="app"
                    value={this.props.app}
                    labelKey="name"
                    onChange={this.onOptionChange}
                    options={this.props.apps}
                    placeholder="Applications"
                    required={true}/>

                {
                    this.state.error &&
                    <span className="error-message">{this.state.error}</span>
                }

                <div className="options flex-row end">
                    <button type="submit" className="btn icon" disabled={this.state.isLoading}>
                        {
                            !this.state.isLoading &&
                            <i className="fa fa-plus option-icon"/>
                        }

                        {
                            this.state.isLoading &&
                            <i className="fa fa-spinner fa-spin option-icon"/>
                        }
                    </button>
                </div>
            </form>
        </header>;
    }
}

export default AddInstanceDropdownHeader;