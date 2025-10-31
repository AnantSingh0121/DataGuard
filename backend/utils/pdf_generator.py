from typing import Dict, Any
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    PageBreak,
    Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import matplotlib
matplotlib.use('Agg')
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from io import BytesIO
import matplotlib.pyplot as plt
import io
from datetime import datetime
from pathlib import Path
def get_health_color(score: float) -> str:
    if score >= 90:
        return "green"
    elif score >= 70:
        return "orange"
    else:
        return "red"

def generate_pdf_report(report_data: Dict[str, Any], filename: str, output):
    from io import BytesIO
    buffer = BytesIO() 
    doc = SimpleDocTemplate(output, pagesize=letter)
    story = []
    elements = []   
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0ea5e9'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#0369a1'),
        spaceAfter=12,
        spaceBefore=20
    )

    story.append(Paragraph("Data Quality & Governance Report", title_style))
    clean_filename = Path(filename).name  
    story.append(Paragraph(f"Dataset: {clean_filename}", styles['Normal']))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    health_score = report_data['health_score']
    score_label = report_data.get('score_label', 'Unknown')
    story.append(Paragraph("Overall Data Health Score", heading_style))
    health_score = float(report_data.get('health_score', 0))
    def get_score_label(score):
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Fair"
        elif score >= 40:
            return "Poor"
        else:
            return "Need Attention"

    score_label = get_score_label(health_score)

    fig, ax = plt.subplots(figsize=(6, 1.2))
    bar_color = get_health_color(health_score)
    ax.barh([''], [health_score], color=bar_color, height=0.4)
    ax.set_xlim(0, 100)
    ax.set_xlabel('Score (%)', fontsize=10)
    ax.set_yticks([])
    ax.text(
        102, 0, f"{health_score:.1f}%  ({score_label})",
        va='center',ha='left',fontsize=12,fontweight='bold',color='black')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color('#cccccc')
    ax.tick_params(axis='x', colors='#666666')
    plt.tight_layout(pad=1.0)
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
    img_buffer.seek(0)
    plt.close()
    story.append(Image(img_buffer, width=5 * inch, height=1 * inch))
    story.append(Spacer(1, 0.2 * inch))


    summary = report_data['summary']
    story.append(Paragraph("Dataset Summary", heading_style))
    summary_data = [
        ['Metric', 'Value'],
        ['Total Rows', f"{summary['total_rows']:,}"],
        ['Total Columns', f"{summary['total_columns']:,}"],
        ['Numeric Columns', f"{summary['numeric_columns']:,}"],
        ['Categorical Columns', f"{summary['categorical_columns']:,}"]
    ]
    summary_table = Table(summary_data, colWidths=[3 * inch, 3 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.3 * inch))

    missing = report_data['missing_values']
    story.append(Paragraph("Missing Values Analysis", heading_style))
    story.append(Paragraph(f"Total Missing: {missing['total_missing']} ({missing['percentage']}%)", styles['Normal']))
    story.append(Paragraph(f"Columns Affected: {missing['columns_affected']}", styles['Normal']))

    if missing['details']:
        mv_data = [['Column', 'Missing Count', 'Percentage']]
        for item in missing['details']:
            mv_data.append([item['column'], item['count'], f"{item['percentage']}%"])
        mv_table = Table(mv_data, colWidths=[2.5 * inch, 2 * inch, 1.5 * inch])
        mv_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(mv_table)
    story.append(Spacer(1, 0.3 * inch))

    duplicates = report_data['duplicates']
    story.append(Paragraph("Duplicate Rows Analysis", heading_style))
    story.append(Paragraph(f"Full Row Duplicates: {duplicates['full_row_duplicates']} ({duplicates['percentage']}%)", styles['Normal']))

    imbalance = report_data['class_imbalance']
    story.append(Paragraph("Class Imbalance Detection", heading_style))
    story.append(Paragraph(f"Columns Affected: {imbalance['columns_with_imbalance']}", styles['Normal']))
    if imbalance['details']:
        ci_data = [['Column', 'Imbalance Ratio', 'Severity', 'Most Common', 'Least Common']]
        for item in imbalance['details']:
            ci_data.append([
    item.get('column', 'N/A'),
    f"{item.get('imbalance_ratio', 'N/A')}:1",
    item.get('severity', 'N/A'),
    item.get('most_common_class', 'N/A'),
    item.get('least_common_class', 'N/A')
])
        ci_table = Table(ci_data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
        ci_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(ci_table)

    type_issues = report_data['data_types']['type_issues']
    story.append(Paragraph("Data Type Issues", heading_style))
    if type_issues:
        ti_data = [['Column', 'Issue', 'Suggested Type']]
        for item in type_issues:
            ti_data.append([item['column'], item['issue'], item['suggested_type']])
        ti_table = Table(ti_data, colWidths=[2 * inch, 2.5 * inch, 1.5 * inch])
        ti_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(ti_table)
    if "outliers" in report_data and report_data["outliers"]:
        outliers = report_data["outliers"]
        story.append(Paragraph("Outliers Detection", heading_style))
        story.append(Paragraph(f"{outliers.get('columns_with_outliers', 0)} Columns with Outliers", styles["Normal"]))
        story.append(Spacer(1, 0.1 * inch))

        details = outliers.get("details", [])
        if details:
            outlier_data = [['Column', 'Outlier Count', 'Percentage', 'Range']]
            for item in details:
                outlier_data.append([item.get('column', 'N/A'),item.get('outlier_count', 'N/A'),item.get('percentage', 'N/A'),item.get('range', 'N/A')
])


            outlier_table = Table(outlier_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 2*inch])
            outlier_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(outlier_table)
            story.append(Spacer(1, 0.3 * inch))

    if "date_formats" in report_data:
        date_formats = report_data["date_formats"]
        story.append(Paragraph("Date Format Analysis", heading_style))
        df_data = [['Column', 'Status', 'Valid Dates', 'Invalid Dates']]
        for item in date_formats['details']:
            df_data.append([item['column'], item['status'], item['valid_dates'], item['invalid_dates']])
        df_table = Table(df_data, colWidths=[2*inch, 2*inch, 1*inch, 1*inch])
        df_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(df_table)


    doc.build(story)
    buffer.seek(0)  
    return buffer