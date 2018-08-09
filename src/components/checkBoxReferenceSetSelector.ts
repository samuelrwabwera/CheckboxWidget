import { Component, createElement } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../ui/checkBoxReferenceSetSelector.css";

export interface CheckboxReferenceSetProps {
    checkboxItems: CheckboxItems[];
    handleChange?: (value: boolean, guid: string) => void;
    fieldCaption: string;
    formOrientation: "Horizontal" | "Vertical" | "LabelHorizontal";
}

export interface CheckboxReferenceSetState {
    checkboxItems: CheckboxItems[];
}

// tslint:disable-next-line:interface-over-type-literal
export type CheckboxItems = {
    caption?: string | number | boolean,
    guid: string;
    isChecked: boolean;
};

export default class CheckBoxReferenceSetSelector extends Component<CheckboxReferenceSetProps, CheckboxReferenceSetState> {
    constructor(props: CheckboxReferenceSetProps) {
        super(props);

        this.state = {
            checkboxItems: []
        };
    }

    render() {
        let checkboxWrapper = "checkbox-wrapper";
        let classCaption = "caption";
        if (this.props.formOrientation === "LabelHorizontal" || this.props.formOrientation === "Horizontal") {
            classCaption = "caption-float-left";
            checkboxWrapper = "checkbox-wrapper-float-left";
        }
        return createElement("div",
            {
                className: "checkBoxReferenceSetSelector"
            },
            createElement("div", {},
                createElement("span", { className: classCaption }, this.props.fieldCaption),
                createElement("div", { className: checkboxWrapper }, this.renderCheckbox())
            )
        );
    }

    componentWillReceiveProps(newProps: CheckboxReferenceSetProps) {
        this.setState({ checkboxItems: newProps.checkboxItems });
    }

    private renderCheckbox() {
        let divClassName = "";
        let labelClassName = "";

        if (this.props.formOrientation === "Horizontal") {
            divClassName = "form-check form-check-inline";
            labelClassName = "form-check-label style-label-horizontal";
        } else if (this.props.formOrientation === "Vertical") {
            divClassName = "form-check";
            labelClassName = "form-check-label style-label-vertical";
        } else {
            divClassName = "form-check";
            labelClassName = "form-check-label style-label-vertical";
        }

        return this.state.checkboxItems.map(_item =>
            createElement("div", { className: divClassName },
                createElement("input",
                    {
                        type: "checkbox",
                        className: "form-check-input",
                        value: _item.guid,
                        onChange: this.handleChange,
                        checked: _item.isChecked
                    }
                ),
                createElement("label", { className: labelClassName, for: "checkboxes" }, _item.caption)
            )
        );

    }

    private handleChange = (event: any) => {
        const guid = event.target.value;
        const checked = event.target.checked;

        if (guid && this.props.handleChange) {
            this.props.handleChange(checked, guid);
        }
    }
}
