import React from "react";
import SearchAppForm from "./search-apps-form";
import customFetch from "../util/custom-fetch";
import PropTypes from 'prop-types';

export default class SideNav extends React.Component {


    state = {
        isOpen: false,
    };

    componentDidMount() {
    }


    _switchOpenState = () => {
        return this.setState({isOpen: !this.state.isOpen})
    };

    _displaySideNav = () => {
        const {isOpen} = this.state;
        if (isOpen) {
            return {
                width: '250px'
            }
        } else {
            return {
                width: '0'
            }
        }
    };

    _displaySideNavButton = () => {
        const {isOpen} = this.state;
        const {isOpenChildren} = this.props;
        if (!isOpen) {
            return (
                <React.Fragment>
                    <div className={"side-nav-tongue"} onClick={() => this._switchOpenState()}>
                        <i className={"fa fa-chevron-right"}/>
                    </div>
                    {isOpenChildren}
                </React.Fragment>

            )
        }
    };

    render() {
        return (
            <React.Fragment>
                <div style={this._displaySideNav()} className={"side-nav"}>
                    <i className={"fa fa-chevron-left"} onClick={() => this._switchOpenState()}/>
                    <div className={"content"}>
                        {this.props.children}
                    </div>
                </div>
                {this._displaySideNavButton()}
            </React.Fragment>

        )
    }
}

SideNav.propTypes = {
    children: PropTypes.node,
    isOpenChildren: PropTypes.node
};
