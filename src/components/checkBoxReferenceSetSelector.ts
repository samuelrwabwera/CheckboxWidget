import { Component, createElement } from "react";

export interface CheckboxReferenceSetProps {
    checkboxItems: CheckboxItems[];
    handleChange?: (value: boolean, guid: string) => void;
    fieldCaption?: string;
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
        return createElement("div",
            {
                className: "checkBoxReferenceSetSelector"
            },
               createElement("div",
                    {
                        className: "checkbox"
                    },

                    this.props.fieldCaption,
                    this.renderCheckbox()
                )
        );
    }

    componentWillReceiveProps(newProps: CheckboxReferenceSetProps) {
        this.setState({ checkboxItems: newProps.checkboxItems });
    }

    private renderCheckbox() {
        return this.state.checkboxItems.map(_item =>
            createElement("label", {},
                createElement("input",
                    {
                        type: "checkbox",
                        className: "checkbox",
                        value: _item.guid,
                        onChange: this.handleChange,
                        checked: _item.isChecked
                    }
                ),
                createElement("span", {}, _item.caption)
            )
        );

    }

    private handleChange = (event: any) => {
        const guid = event.target.value;
        const checked = event.target.checked;

        if (guid && checked && this.props.handleChange) {
            this.props.handleChange(checked, guid);
        }
    }
}
